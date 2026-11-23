<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Story extends Model
{
    use SoftDeletes;

    public const STATUS_DRAFT = 'draft';

    public const STATUS_PENDING = 'pending';

    public const STATUS_APPROVED = 'approved';

    public const STATUS_REJECTED = 'rejected';

    /** @var list<string> */
    public const STATUSES = [
        self::STATUS_DRAFT,
        self::STATUS_PENDING,
        self::STATUS_APPROVED,
        self::STATUS_REJECTED,
    ];

    public const CATEGORY_COMMUNITY = 'community';

    public const CATEGORY_CONCERT = 'concert';

    public const CATEGORY_REHEARSAL = 'rehearsal';

    public const CATEGORY_LENDING_LIBRARY = 'lending-library';

    /** @var list<string> */
    public const CATEGORIES = [
        self::CATEGORY_COMMUNITY,
        self::CATEGORY_CONCERT,
        self::CATEGORY_REHEARSAL,
        self::CATEGORY_LENDING_LIBRARY,
    ];

    protected $fillable = [
        'title',
        'slug',
        'reference_code',
        'category',
        'excerpt',
        'body',
        'author_name',
        'author_email',
        'author_role',
        'cover_image_path',
        'cover_image_url',
        'status',
        'consent_at',
        'reviewed_by',
        'reviewed_at',
        'rejection_reason',
        'is_sample',
        'is_featured',
        'published_at',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'is_sample' => 'boolean',
            'is_featured' => 'boolean',
            'consent_at' => 'datetime',
            'reviewed_at' => 'datetime',
            'published_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Story $story): void {
            if (blank($story->reference_code)) {
                $story->reference_code = static::generateReferenceCode();
            }
        });
    }

    public static function generateReferenceCode(): string
    {
        do {
            $code = 'MWB-'.Str::upper(Str::random(8));
        } while (static::where('reference_code', $code)->exists());

        return $code;
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function moderationEvents(): HasMany
    {
        return $this->hasMany(StoryModerationEvent::class)->orderByDesc('created_at')->orderByDesc('id');
    }

    public function latestModerationEvent(): HasOne
    {
        return $this->hasOne(StoryModerationEvent::class)->latestOfMany('id');
    }

    public function scopeApproved(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_APPROVED);
    }

    public function scopeFeatured(Builder $query): Builder
    {
        return $query->where('is_featured', true);
    }

    public function scopeCategory(Builder $query, string $category): Builder
    {
        return $query->where('category', $category);
    }

    public function scopeWithStatus(Builder $query, string $status): Builder
    {
        return $query->where('status', $status);
    }
}
