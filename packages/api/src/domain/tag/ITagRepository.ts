export interface Tag {
  id: string;
  slug: string;
  name: string;
}

export interface ITagRepository {
  findById(id: string): Promise<Tag | null>;
  findBySlug(slug: string): Promise<Tag | null>;
  findOrCreate(slug: string, name: string): Promise<Tag>;
  findAll(): Promise<Tag[]>;
}
