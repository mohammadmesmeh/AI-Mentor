<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Modules\Identity\Application\Actions\RefreshAuthentication;
use App\Modules\Identity\Application\Exceptions\InvalidRefreshTokenException;
use App\Modules\Identity\Infrastructure\Persistence\Models\RefreshToken;
use App\Modules\Identity\Infrastructure\Persistence\Models\User;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;
use Throwable;

final class RefreshTokenConcurrencyTest extends TestCase
{
    public function test_two_concurrent_refreshes_cannot_leave_a_reusable_family(): void
    {
        if (! function_exists('pcntl_fork')) {
            self::markTestSkipped('The Docker runtime provides pcntl for this concurrency integration test.');
        }

        $user = User::factory()->create();
        $tokens = $this->issueTokenPair($user);
        $familyId = $tokens->access->claims->familyId;
        $children = [];

        for ($worker = 0; $worker < 2; $worker++) {
            $sockets = stream_socket_pair(STREAM_PF_UNIX, STREAM_SOCK_STREAM, STREAM_IPPROTO_IP);
            self::assertNotFalse($sockets);
            $pid = pcntl_fork();
            self::assertNotSame(-1, $pid);

            if ($pid === 0) {
                fclose($sockets[0]);
                usleep(250_000);
                DB::purge();

                try {
                    $this->app->make(RefreshAuthentication::class)->execute($tokens->refreshToken);
                    fwrite($sockets[1], 'success');
                } catch (InvalidRefreshTokenException) {
                    fwrite($sockets[1], 'invalid');
                } catch (Throwable $exception) {
                    fwrite($sockets[1], 'error:'.$exception::class);
                }

                fclose($sockets[1]);
                exit(0);
            }

            fclose($sockets[1]);
            $children[] = ['pid' => $pid, 'socket' => $sockets[0]];
        }

        $outcomes = [];

        foreach ($children as $child) {
            pcntl_waitpid($child['pid'], $status);
            $outcomes[] = stream_get_contents($child['socket']);
            fclose($child['socket']);
            self::assertTrue(pcntl_wifexited($status));
            self::assertSame(0, pcntl_wexitstatus($status));
        }

        sort($outcomes);
        DB::purge();

        self::assertSame(['invalid', 'success'], $outcomes);
        self::assertSame(0, RefreshToken::query()
            ->where('family_id', $familyId)
            ->whereNull('revoked_at')
            ->count());

        User::query()->whereKey($user->id)->delete();
    }
}
