import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Table: React.FC<React.TableHTMLAttributes<HTMLTableElement>> = ({
  className,
  children,
  ...props
}) => (
  <div className="w-full overflow-x-auto no-scrollbar rounded-xl border border-white/[0.08] bg-[#0E1015]">
    <table
      className={twMerge(clsx('w-full text-left text-xs text-[#FAFAFA] border-collapse', className))}
      {...props}
    >
      {children}
    </table>
  </div>
);

export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  className,
  children,
  ...props
}) => (
  <thead
    className={twMerge(
      clsx('bg-[#151821] border-b border-white/[0.08] uppercase text-[10px] tracking-[0.14em] font-mono font-bold text-white/50 select-none', className)
    )}
    {...props}
  >
    {children}
  </thead>
);

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  className,
  children,
  ...props
}) => (
  <tbody className={twMerge(clsx('divide-y divide-white/[0.05]', className))} {...props}>
    {children}
  </tbody>
);

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({
  className,
  children,
  ...props
}) => (
  <tr
    className={twMerge(
      clsx('hover:bg-white/[0.03] transition-colors group cursor-default', className)
    )}
    {...props}
  >
    {children}
  </tr>
);

export const TableHead: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({
  className,
  children,
  ...props
}) => (
  <th
    className={twMerge(clsx('py-3 px-3.5 sm:px-4 font-mono font-bold select-none whitespace-nowrap', className))}
    {...props}
  >
    {children}
  </th>
);

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({
  className,
  children,
  ...props
}) => (
  <td className={twMerge(clsx('py-3 px-3.5 sm:px-4 text-white/90', className))} {...props}>
    {children}
  </td>
);
