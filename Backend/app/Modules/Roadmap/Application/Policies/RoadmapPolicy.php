<?php

declare(strict_types=1);

namespace App\Modules\Roadmap\Application\Policies;

use App\Modules\Identity\Infrastructure\Persistence\Models\User;
use App\Modules\Roadmap\Infrastructure\Persistence\Models\Roadmap;

final class RoadmapPolicy
{
    public function view(User $user, Roadmap $roadmap): bool
    {
        return $roadmap->user_id === $user->id;
    }

    public function update(User $user, Roadmap $roadmap): bool
    {
        return $this->view($user, $roadmap);
    }

    public function delete(User $user, Roadmap $roadmap): bool
    {
        return false;
    }
}
