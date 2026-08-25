<?php

declare(strict_types=1);

namespace App\Modules\LearningProfile\Domain\Enums;

enum LearningMethod: string
{
    case HandsOnProjects = 'hands_on_projects';
    case ReadingDocs = 'reading_docs';
    case VideoWalkthroughs = 'video_walkthroughs';
    case QuizzesDrills = 'quizzes_drills';
}
