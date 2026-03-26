/**
 * Mongoose Lean Document Types
 *
 * Provides type-safe utilities for working with Mongoose `.lean()` results,
 * eliminating the need for `as unknown as T` casts throughout the codebase.
 *
 * Usage:
 *   import type { LeanDoc } from '@/types/mongoose';
 *   import type { IPost } from '@/models/Post';
 *
 *   const post = await Post.findById(id).lean() as LeanDoc<IPost> | null;
 *   // post._id is string, post.createdAt is string, etc.
 */

/**
 * Converts a Mongoose document interface into a plain lean object type.
 *
 * - `_id` becomes `string` (serialized ObjectId)
 * - Mongoose timestamps (`createdAt`, `updatedAt`) become `string`
 * - All other properties remain as defined in the interface
 */
export type LeanDoc<T> = Omit<T, '_id'> & {
	_id: string;
	createdAt?: string;
	updatedAt?: string;
};

/**
 * Utility type: extract the `id` field typically added in service layer
 * transforms (where `_id` is mapped to `id`).
 */
export type WithId<T> = Omit<T, '_id'> & { id: string };
