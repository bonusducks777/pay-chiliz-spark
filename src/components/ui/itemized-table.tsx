import React from 'react';

interface ItemizedItem {
  name: string;
  quantity: number | string;
  value: number | string;
}

interface ItemizedTableProps {
  itemizedList: string;
  size?: 'sm' | 'md' | 'lg';
  currency?: string;
  className?: string;
}

export const ItemizedTable: React.FC<ItemizedTableProps> = ({ 
  itemizedList, 
  size = 'md', 
  currency = '', 
  className = '' 
}) => {
  try {
    const items: ItemizedItem[] = JSON.parse(itemizedList);
    
    if (!Array.isArray(items) || items.length === 0) {
      return (
        <div className={`text-muted-foreground text-center py-2 ${className}`}>
          No items specified
        </div>
      );
    }

    const sizeClasses = {
      sm: 'text-[10px]',
      md: 'text-xs',
      lg: 'text-sm'
    };

    const paddingClasses = {
      sm: 'p-1',
      md: 'p-2',
      lg: 'p-3'
    };

    return (
      <div className={`space-y-2 ${className}`}>
        <div className="text-sm text-muted-foreground font-medium">Items</div>
        <div className="bg-muted/30 rounded-lg border border-border/30 overflow-hidden">
          {/* Header */}
          <div className={`grid grid-cols-[2fr_1fr_1fr] gap-2 ${paddingClasses[size]} bg-muted/50 border-b border-border/30 font-semibold ${sizeClasses[size]}`}>
            <span>Item Name</span>
            <span className="text-center">Qty</span>
            <span className="text-center">Price</span>
          </div>
          
          {/* Items */}
          {items.map((item, index) => (
            <div 
              key={index} 
              className={`grid grid-cols-[2fr_1fr_1fr] gap-2 ${paddingClasses[size]} ${sizeClasses[size]} hover:bg-muted/20 transition-colors ${
                index < items.length - 1 ? 'border-b border-border/20' : ''
              }`}
            >
              <span className="font-medium truncate" title={item.name}>
                {item.name}
              </span>
              <span className="text-center font-mono">
                {item.quantity}
              </span>
              <span className="text-center font-mono">
                {item.value}{currency && ` ${currency}`}
              </span>
            </div>
          ))}
          
          {/* Total */}
          {items.length > 1 && (
            <div className={`grid grid-cols-[2fr_1fr_1fr] gap-2 ${paddingClasses[size]} bg-muted/30 border-t border-border/30 font-semibold ${sizeClasses[size]}`}>
              <span>Total</span>
              <span className="text-center">
                {items.reduce((sum, item) => sum + Number(item.quantity), 0)}
              </span>
              <span className="text-center font-mono">
                {items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.value)), 0).toFixed(3)}
                {currency && ` ${currency}`}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className={`text-destructive text-center py-2 ${className}`}>
        Invalid itemized list format
      </div>
    );
  }
};
