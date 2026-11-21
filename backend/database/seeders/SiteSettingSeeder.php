<?php

namespace Database\Seeders;

use App\Models\SiteSetting;
use Illuminate\Database\Seeder;

class SiteSettingSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            ['site', 'site.name', 'Music Without Borders'],
            ['site', 'site.tagline', 'A volunteer, non-profit band teaching and performing free music for our community.'],
            ['contact', 'contact.phone_label', '0994-329-5457'],
            ['contact', 'contact.phone_href', 'tel:+639943295457'],
            ['contact', 'contact.address', 'Pandacaqui, Mexico, Pampanga, Philippines'],
            ['contact', 'contact.venue', 'Pandacaqui Community Center, Mexico, Pampanga, Philippines'],
            ['contact', 'contact.email', 'Communitymusicband@gmail.com'],
            ['rehearsal', 'rehearsal.schedule', 'Saturdays, 9:00 AM to 12:00 NN'],
            ['footer', 'footer.copyright', '© 2026 Music Without Borders. A non-profit organization.'],
            ['social', 'social.facebook', 'https://facebook.com'],
            ['social', 'social.instagram', 'https://instagram.com'],
            ['social', 'social.youtube', 'https://youtube.com'],
            ['seo', 'seo.home.page_title', 'Music that belongs to everyone'],
            ['seo', 'seo.home.og_title', 'Music that belongs to everyone'],
            ['seo', 'seo.home.og_description', 'Free to learn, free to listen, free to join. A volunteer band making room for more music in our community.'],
            ['seo', 'seo.about.page_title', 'About Us'],
            ['seo', 'seo.about.og_title', 'About Us - Music Without Borders'],
            ['seo', 'seo.about.og_description', 'Learn about our mission to make music accessible to everyone in Pampanga. Free lessons, free instruments, free concerts.'],
            ['seo', 'seo.instruments.page_title', 'Instruments'],
            ['seo', 'seo.instruments.og_title', 'Meet the instruments behind the music'],
            ['seo', 'seo.instruments.og_description', 'Explore the woodwind, brass, string, and percussion instruments in our free lending library.'],
            ['seo', 'seo.performances.page_title', '2026 Concert Season & Performances'],
            ['seo', 'seo.performances.og_title', 'Live Performances & Rehearsal Schedule'],
            ['seo', 'seo.performances.og_description', 'All Music Without Borders concerts and outreach events are free and open to everyone.'],
            ['seo', 'seo.donate.page_title', 'Donate'],
            ['seo', 'seo.donate.og_title', 'Support free music in Pampanga'],
            ['seo', 'seo.donate.og_description', 'Your gift keeps lessons, instruments, and concerts free for the community.'],
            ['seo', 'seo.stories.page_title', 'Notes from the Bandstand'],
            ['seo', 'seo.stories.og_title', 'Notes from the Bandstand'],
            ['seo', 'seo.stories.og_description', 'Progress reports and stories from the people the band has helped.'],
            ['performances', 'performances.sample_notice', 'Sample schedule for the CMS demo. Replace these dates and details with the band\'s real 2026 events.'],
        ];

        foreach ($settings as [$group, $key, $value]) {
            SiteSetting::query()->updateOrCreate(
                ['key' => $key],
                ['group_name' => $group, 'value' => $value]
            );
        }
    }
}
