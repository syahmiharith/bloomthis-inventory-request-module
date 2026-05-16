export type StockStatus = "In Stock" | "Low Stock" | "Out of Stock";

export function availableQuantity(onHand: number, reserved: number) {
  return onHand - reserved;
}

export function stockStatusFromQuantities(
  onHand: number,
  reserved: number,
  reorderPoint: number,
): StockStatus {
  const available = availableQuantity(onHand, reserved);
  if (available <= 0) {
    return "Out of Stock";
  }
  if (available <= reorderPoint) {
    return "Low Stock";
  }
  return "In Stock";
}

export function stockHealthInterpretation(status: StockStatus) {
  if (status === "Out of Stock") {
    return "Out of stock. Pending requests may not be fulfillable.";
  }
  if (status === "Low Stock") {
    return "Low stock. Available stock is at or below reorder point.";
  }
  return "Healthy stock level. Available stock is above reorder point.";
}

export function stockRiskRank(status: StockStatus) {
  if (status === "Out of Stock") {
    return 0;
  }
  if (status === "Low Stock") {
    return 1;
  }
  return 2;
}

export function calculateStockKpis(
  items: Array<{
    quantityOnHand: number;
    quantityReserved: number;
    reorderPoint: number;
    warehouse: string;
  }>,
) {
  const result = {
    totalItems: items.length,
    warehouses: new Set(items.map((item) => item.warehouse)).size,
    riskItems: 0,
    outOfStock: 0,
    reservedStock: 0,
    healthyItems: 0,
  };

  for (const item of items) {
    const status = stockStatusFromQuantities(
      item.quantityOnHand,
      item.quantityReserved,
      item.reorderPoint,
    );
    result.reservedStock += item.quantityReserved;
    if (status === "Out of Stock") {
      result.outOfStock += 1;
      result.riskItems += 1;
    } else if (status === "Low Stock") {
      result.riskItems += 1;
    } else {
      result.healthyItems += 1;
    }
  }

  return result;
}
