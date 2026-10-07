import { Breadcrumb, BreadcrumbEllipsis, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link } from '@inertiajs/react';
import { Fragment } from 'react';

export function Breadcrumbs({ items }: { items: Array<{ label: string; href?: string }> }) {
  if (!items || items.length === 0) return null;

  const firstItem = items[0];
  const lastItem = items[items.length - 1];
  const middleItems = items.length > 2 ? items.slice(1, items.length - 1) : [];
  const hasMiddleItems = middleItems.length > 0;

  return (
    <Breadcrumb>
      {/* Large Desktop view (xl and above): Show all breadcrumb items */}
      <BreadcrumbList className={hasMiddleItems ? "hidden xl:flex" : "flex"}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <Fragment key={index}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={item.href || '#'}>{item.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </Fragment>
          );
        })}
      </BreadcrumbList>

      {/* Collapsed view (< xl, including 768px to 1254px range): Collapse middle items into an Ellipsis Dropdown if items > 2 */}
      {hasMiddleItems && (
        <BreadcrumbList className="flex xl:hidden">
          {/* First Item */}
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={firstItem.href || '#'}>{firstItem.label}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          
          <BreadcrumbSeparator />

          {/* Ellipsis Dropdown for middle navigation items */}
          <BreadcrumbItem>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center justify-center focus:outline-none rounded-md hover:bg-accent p-1 transition-colors" aria-label="Show navigation menu">
                <BreadcrumbEllipsis className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-[10rem]">
                {middleItems.map((middle, idx) => (
                  <DropdownMenuItem key={idx} asChild>
                    <Link href={middle.href || '#'} className="w-full cursor-pointer text-sm">
                      {middle.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </BreadcrumbItem>

          <BreadcrumbSeparator />

          {/* Current / Last Item */}
          <BreadcrumbItem className="max-w-[140px] sm:max-w-[200px] truncate">
            <BreadcrumbPage className="truncate">{lastItem.label}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      )}
    </Breadcrumb>
  );
}
