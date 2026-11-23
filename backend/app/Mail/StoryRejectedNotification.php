<?php

namespace App\Mail;

use App\Models\Story;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class StoryRejectedNotification extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Story $story,
        public string $reason,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Update regarding your story: '.$this->story->title,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.story-rejected',
            text: 'emails.story-rejected-text',
        );
    }
}
