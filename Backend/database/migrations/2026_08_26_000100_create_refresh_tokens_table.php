<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('refresh_tokens', function (Blueprint $table): void {
            $table->ulid('id')->primary();
            $table->foreignUlid('user_id')->constrained()->cascadeOnDelete();
            $table->ulid('family_id');
            $table->char('token_hash', 64)->unique();
            $table->timestamp('expires_at');
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('revoked_at')->nullable();
            $table->ulid('replaced_by_id')->nullable();
            $table->timestamps();

            $table->index(['family_id', 'revoked_at'], 'refresh_tokens_family_revoked_index');
            $table->index(['user_id', 'revoked_at'], 'refresh_tokens_user_revoked_index');
            $table->index('expires_at', 'refresh_tokens_expires_index');
        });

        Schema::table('refresh_tokens', function (Blueprint $table): void {
            $table->foreign('replaced_by_id')
                ->references('id')
                ->on('refresh_tokens')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('refresh_tokens');
    }
};
