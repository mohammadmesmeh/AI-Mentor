<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('roadmaps', function (Blueprint $table): void {
            $table->foreignUlid('current_version_id')
                ->nullable()
                ->after('user_id')
                ->constrained('roadmap_versions')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('roadmaps', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('current_version_id');
        });
    }
};
