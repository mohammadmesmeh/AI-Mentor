<?php

namespace Tests;

use App\Modules\Identity\Application\Actions\IssueAuthenticationSession;
use App\Modules\Identity\Application\Data\IssuedTokenPair;
use App\Modules\Identity\Infrastructure\Persistence\Models\User;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\DB;

abstract class TestCase extends BaseTestCase
{
    protected string $jwtTestSecret;

    protected function setUp(): void
    {
        parent::setUp();

        $this->jwtTestSecret = random_bytes(32);
        config(['jwt.secret' => base64_encode($this->jwtTestSecret)]);
    }

    protected function withJwt(User $user): static
    {
        $tokens = $this->issueTokenPair($user);
        $this->withToken($tokens->access->token);

        return $this;
    }

    protected function issueTokenPair(User $user): IssuedTokenPair
    {
        return DB::transaction(fn (): IssuedTokenPair => $this->app
            ->make(IssueAuthenticationSession::class)
            ->execute($user)
            ->tokens);
    }
}
