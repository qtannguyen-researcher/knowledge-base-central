export interface CategoryProps {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  parentId?: string | null;
  path: string;
  depth: number;
  createdAt?: Date;
}

export class Category {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string | null;
  readonly parentId: string | null;
  readonly path: string;
  readonly depth: number;
  readonly createdAt: Date;

  constructor(props: CategoryProps) {
    this.id = props.id;
    this.slug = props.slug;
    this.name = props.name;
    this.description = props.description ?? null;
    this.parentId = props.parentId ?? null;
    this.path = props.path;
    this.depth = props.depth;
    this.createdAt = props.createdAt ?? new Date();
  }

  static buildPath(slug: string, parent?: Category): string {
    const normalizedSlug = slug.trim();
    if (!parent) {
      return normalizedSlug;
    }
    return `${parent.path}/${normalizedSlug}`;
  }

  toProps(): CategoryProps {
    return {
      id: this.id,
      slug: this.slug,
      name: this.name,
      description: this.description,
      parentId: this.parentId,
      path: this.path,
      depth: this.depth,
      createdAt: this.createdAt,
    };
  }
}
