import React from 'react';

interface TableColumn {
  header: string;
  accessor: string;
}

interface TableProps {
  columns: TableColumn[];
  data: Record<string, any>[];
  className?: string;
}

export const Table: React.FC<TableProps> = ({ columns, data, className = '' }) => (
  <div className={`overflow-x-auto ${className}`}>
    <table className="min-w-full border border-gray-200 rounded">
      <thead className="bg-gray-100">
        <tr>
          {columns.map(col => (
            <th key={col.accessor} className="px-4 py-2 text-left font-semibold border-b border-gray-200">
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i} className="even:bg-gray-50">
            {columns.map(col => (
              <td key={col.accessor} className="px-4 py-2 border-b border-gray-100">
                {row[col.accessor]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default Table; 