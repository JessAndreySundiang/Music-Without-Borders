<?php

namespace App\Mail;

use App\Models\Story;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class StorySubmittedConfirmation extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Story $story,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'We received your story: '.$this->story->title,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.story-submitted',
            text: 'emails.story-submitted-text',
        );
    }
}
