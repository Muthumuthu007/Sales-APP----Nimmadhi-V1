import ProductMrp from '../ProductMrp';
import {MrpColumnContext} from '../../context/ProductMrpContext';
import React from 'react';
import { EmptyState } from './StateContainers';
import './Table.css';

export const Table = ({ columns, data, onRowClick, emptyStateMessage = "No records found.", className = '' }) => {
  if (!data || data.length === 0) {
    return <EmptyState title={emptyStateMessage} />;
  }

  const productColumn=columns.findIndex(col=>['productName','product_name','product','products'].includes(col.key) || (col.key==='name' && data.some(row=>row.product_id || row.productId)));
  const hasMrp=columns.some(col=>/mrp/i.test(`${col.key} ${col.label}`));
  const displayColumns=[...columns];
  if(productColumn>=0 && !hasMrp)displayColumns.splice(productColumn+1,0,{key:'mappedMrp',label:'MRP',render:row=>{
    const items=row.items?.length?row.items:row.products?.length && typeof row.products[0]==='object'?row.products:[row];
    return items.map((item,index)=><ProductMrp key={index} item={item} label={items.length>1}/>);
  }});
  return (
    <MrpColumnContext.Provider value={productColumn>=0 || hasMrp}><div className="table-container">
      <table className={`table ${className}`}>
        <thead>
          <tr>
            {displayColumns.map((col, index) => (
              <th key={index} className={`${col.align || 'left'} ${col.className || ''}`}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr 
              key={rowIndex} 
              onClick={() => onRowClick && onRowClick(row)}
              className={onRowClick ? 'clickable' : ''}
            >
              {displayColumns.map((col, colIndex) => (
                <td key={colIndex} className={`${col.align || 'left'} ${col.className || ''}`}>
                  {col.render ? col.render(row, rowIndex) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div></MrpColumnContext.Provider>
  );
};
