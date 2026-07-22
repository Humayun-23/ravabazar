import { Sofa, Armchair, Lamp, Bed, Package, Shirt, Smartphone, ShoppingCart } from 'lucide-react';

export const getCategoryIcon = (categoryName: string) => {
  const name = categoryName.toLowerCase();
  if (name.includes('sofa') || name.includes('couch')) return Sofa;
  if (name.includes('chair') || name.includes('armchair')) return Armchair;
  if (name.includes('lamp') || name.includes('light')) return Lamp;
  if (name.includes('bed')) return Bed;
  if (name.includes('clothing') || name.includes('shirt')) return Shirt;
  if (name.includes('electronic') || name.includes('phone') || name.includes('laptop')) return Smartphone;
  if (name.includes('grocer') || name.includes('food')) return ShoppingCart;
  return Package;
};
