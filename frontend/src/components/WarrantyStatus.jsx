// frontend/src/components/WarrantyStatus.jsx
import React from 'react';

const getWarrantyInfo = (expiryDateStr) => {
  if (!expiryDateStr) return { text: 'N/A', className: 'default' };

  const expiryDate = new Date(expiryDateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = expiryDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { text: `Expired`, className: 'expired' };
  if (diffDays === 0) return { text: 'Expires Today', className: 'expiring-soon' };
  if (diffDays <= 30) return { text: `in ${diffDays} days`, className: 'expiring-soon' };
  return { text: `on ${expiryDate.toLocaleDateString()}`, className: 'active' };
};

const WarrantyStatus = ({ expiryDate }) => {
  const { text, className } = getWarrantyInfo(expiryDate);
  return <span className={`warranty-status-badge ${className}`}>{text}</span>;
};

export default WarrantyStatus;