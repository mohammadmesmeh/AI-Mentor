<?php

declare(strict_types=1);

namespace App\Modules\Roadmap\Infrastructure\Generation;

use App\Modules\Roadmap\Application\Contracts\RoadmapGenerator;

final class FakeRoadmapGenerator implements RoadmapGenerator
{
    /** @param array<string, mixed> $snapshot
     * @return array<string, mixed>
     */
    public function generate(array $snapshot): array
    {
        $profile = is_array($snapshot['learning_profile'] ?? null) ? $snapshot['learning_profile'] : [];
        $preferences = is_array($snapshot['preferences'] ?? null) ? $snapshot['preferences'] : [];
        $goal = is_string($profile['goal'] ?? null) ? trim($profile['goal']) : 'your learning goal';
        $language = is_string($preferences['resource_language'] ?? null)
            ? $preferences['resource_language']
            : 'both';
        $weeklyMinutes = is_int($profile['available_minutes_per_week'] ?? null)
            ? $profile['available_minutes_per_week']
            : 270;
        $taskMinutes = max(20, min(90, intdiv($weeklyMinutes, 9)));
        $stageDefinitions = [
            [
                'title' => $this->localized($language, 'الأساسيات', 'Foundations'),
                'description' => $this->localized(
                    $language,
                    "افهم المفاهيم الأساسية اللازمة لتحقيق هدفك: {$goal}",
                    "Understand the fundamentals needed for your goal: {$goal}",
                ),
            ],
            [
                'title' => $this->localized($language, 'التطبيق الموجّه', 'Guided Practice'),
                'description' => $this->localized(
                    $language,
                    "طبّق المفاهيم تدريجيًا على أمثلة مرتبطة بهدفك: {$goal}",
                    "Apply the concepts incrementally to examples related to your goal: {$goal}",
                ),
            ],
            [
                'title' => $this->localized($language, 'مشروع الإتقان', 'Mastery Project'),
                'description' => $this->localized(
                    $language,
                    "أنجز مشروعًا متكاملًا يثبت قدرتك على: {$goal}",
                    "Complete an end-to-end project that demonstrates: {$goal}",
                ),
            ],
        ];
        $taskTemplates = [
            ['read', 'دراسة المفاهيم', 'Study the concepts'],
            ['quiz', 'تحقق من الفهم', 'Check your understanding'],
            ['project', 'طبّق عمليًا', 'Apply it in practice'],
        ];
        $resources = [
            ['title' => 'Laravel Documentation', 'url' => 'https://laravel.com/docs', 'type' => 'documentation'],
            ['title' => 'PHP Manual', 'url' => 'https://www.php.net/docs.php', 'type' => 'documentation'],
            ['title' => 'MySQL Documentation', 'url' => 'https://dev.mysql.com/doc/', 'type' => 'documentation'],
            ['title' => 'Redis Documentation', 'url' => 'https://redis.io/docs/latest/', 'type' => 'documentation'],
        ];
        $stages = [];
        $previousTaskKey = null;

        foreach ($stageDefinitions as $stageIndex => $stageDefinition) {
            $tasks = [];

            foreach ($taskTemplates as $taskIndex => [$type, $arabicTitle, $englishTitle]) {
                $taskKey = sprintf('stage-%d-task-%d', $stageIndex + 1, $taskIndex + 1);
                $tasks[] = [
                    'key' => $taskKey,
                    'type' => $type,
                    'title' => $this->localized($language, $arabicTitle, $englishTitle),
                    'instructions' => $this->localized(
                        $language,
                        "نفّذ هذه المهمة كخطوة عملية نحو: {$goal}",
                        "Complete this task as a practical step toward: {$goal}",
                    ),
                    'estimated_minutes' => $taskMinutes,
                    'dependencies' => $previousTaskKey === null ? [] : [$previousTaskKey],
                    'resources' => [$resources[($stageIndex * 3 + $taskIndex) % count($resources)]],
                ];
                $previousTaskKey = $taskKey;
            }

            $stages[] = [
                ...$stageDefinition,
                'estimated_minutes' => $taskMinutes * count($tasks),
                'tasks' => $tasks,
            ];
        }

        return ['stages' => $stages];
    }

    private function localized(string $language, string $arabic, string $english): string
    {
        return match ($language) {
            'ar' => $arabic,
            'en' => $english,
            default => $arabic.' / '.$english,
        };
    }
}
