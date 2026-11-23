<?php

namespace App\Mail;

use App\Models\Story;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class StoryApprovedNotification extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Story $story,
        public string $publicUrl,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your story has been published: '.$this->story->title,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.story-approved',
            text: 'emails.story-approved-text',
        );
    }
}
