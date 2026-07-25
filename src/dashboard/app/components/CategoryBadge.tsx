import type { CategoryCode } from '../../lib/types';

interface CategoryBadgeProps {
  categoryCode: CategoryCode;
  label: string;
}

export function CategoryBadge({ categoryCode, label }: CategoryBadgeProps) {
  return (
    <span data-testid="category-badge" className={`category-badge category-badge--${categoryCode}`}>
      {label}
    </span>
  );
}
