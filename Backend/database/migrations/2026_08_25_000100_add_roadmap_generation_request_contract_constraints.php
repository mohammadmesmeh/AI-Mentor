<?php

declare(strict_types=1);

use App\Modules\Roadmap\Domain\Enums\GenerationRequestStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const IDEMPOTENCY_UNIQUE = 'generation_requests_user_idempotency_unique';

    private const ACTIVE_UNIQUE = 'generation_requests_user_active_unique';

    private const ACTIVE_CHECK = 'generation_requests_active_slot_check';

    public function up(): void
    {
        $duplicateActiveUser = DB::table('roadmap_generation_requests')
            ->whereIn('status', GenerationRequestStatus::activeValues())
            ->groupBy('user_id')
            ->havingRaw('COUNT(*) > 1')
            ->value('user_id');

        if ($duplicateActiveUser !== null) {
            throw new RuntimeException('Cannot enforce one active generation request: historical duplicates exist.');
        }

        Schema::table('roadmap_generation_requests', function (Blueprint $table): void {
            $table->char('idempotency_key_hash', 64)->nullable()->after('idempotency_key');
            $table->unsignedSmallInteger('snapshot_schema_version')->default(1)->after('status');
            $table->unsignedTinyInteger('active_slot')->nullable()->after('status');
        });

        DB::table('roadmap_generation_requests')
            ->whereIn('status', GenerationRequestStatus::activeValues())
            ->update(['active_slot' => 1]);

        Schema::table('roadmap_generation_requests', function (Blueprint $table): void {
            $table->unique(['user_id', 'idempotency_key_hash'], self::IDEMPOTENCY_UNIQUE);
            $table->unique(['user_id', 'active_slot'], self::ACTIVE_UNIQUE);
        });

        if (DB::getDriverName() === 'mysql') {
            DB::statement(sprintf(
                'ALTER TABLE roadmap_generation_requests ADD CONSTRAINT %s CHECK (active_slot IS NULL OR active_slot = 1)',
                self::ACTIVE_CHECK,
            ));
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement(sprintf(
                'ALTER TABLE roadmap_generation_requests DROP CHECK %s',
                self::ACTIVE_CHECK,
            ));
        }

        Schema::table('roadmap_generation_requests', function (Blueprint $table): void {
            $table->dropUnique(self::IDEMPOTENCY_UNIQUE);
            $table->dropUnique(self::ACTIVE_UNIQUE);
            $table->dropColumn(['idempotency_key_hash', 'snapshot_schema_version', 'active_slot']);
        });
    }
};
