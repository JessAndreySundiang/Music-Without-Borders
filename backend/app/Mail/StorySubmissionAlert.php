<?php

namespace App\Mail;

use App\Models\Story;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class StorySubmissionAlert extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Story $story,
        public string $reviewUrl,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'New story pending review: '.$this->story->title,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.story-admin-alert',
            text: 'emails.story-admin-alert-text',
        );
    }
}
