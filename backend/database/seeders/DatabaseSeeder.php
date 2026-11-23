<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            SiteSettingSeeder::class,
            HomePageSeeder::class,
            AboutPageSeeder::class,
            TestimonialSeeder::class,
            PerformanceSeeder::class,
            StorySeeder::class,
            StorySubmissionSeeder::class,
        ]);
    }
}
