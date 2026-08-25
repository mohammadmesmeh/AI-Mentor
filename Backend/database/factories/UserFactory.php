<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Modules\Identity\Domain\Enums\UserStatus;
use App\Modules\Identity\Infrastructure\Persistence\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/** @extends Factory<User> */
final class UserFactory extends Factory
{
    protected $model = User::class;

    private static ?string $password = null;

    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => self::$password ??= Hash::make('password'),
            'status' => UserStatus::Active,
            'remember_token' => Str::random(10),
        ];
    }

    public function unverified(): static
    {
        return $this->state(fn (array $attributes): array => ['email_verified_at' => null]);
    }
}
