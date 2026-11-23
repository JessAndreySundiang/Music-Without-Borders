<?php

namespace App\Http\Requests;

use App\Models\Story;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreStorySubmissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'min:5', 'max:120'],
            'category' => ['nullable', 'string', Rule::in(Story::CATEGORIES)],
            'author_name' => ['required', 'string', 'min:2', 'max:80'],
            'author_email' => ['required', 'string', 'email', 'max:255'],
            'author_role' => ['nullable', 'string', 'min:2', 'max:100'],
            'body' => ['required', 'string', 'min:200', 'max:10000'],
            'excerpt' => ['nullable', 'string', 'max:500'],
            'cover_image_url' => ['nullable', 'string', 'url', 'regex:/^https:\/\//i', 'max:2048'],
            'consent' => ['required', 'accepted'],
            // Bots fill this hidden field. A real submission leaves it empty.
            'website' => ['prohibited'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'consent.accepted' => 'Please confirm that your story may be published.',
            'website.prohibited' => 'This submission could not be accepted.',
            'cover_image_url.regex' => 'The cover image URL must use secure HTTPS.',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $email = Str::lower(trim((string) $this->input('author_email')));
            $title = trim(preg_replace('/\s+/', ' ', (string) $this->input('title')));

            if ($email !== '' && $title !== '') {
                $duplicate = Story::query()
                    ->where('author_email', $email)
                    ->where('title', $title)
                    ->where('created_at', '>=', now()->subHours(24))
                    ->exists();

                if ($duplicate) {
                    $validator->errors()->add(
                        'title',
                        'A submission with this title has already been received from this email address in the last 24 hours.'
                    );
                }
            }
        });
    }
}
