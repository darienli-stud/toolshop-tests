export interface CustomerData {
  firstName: string;
  lastName: string;
  dob: string;
  phone: string;
  country: string;
  postalCode: string;
  houseNumber: string;
  street: string;
  city: string;
  state: string;
}

export interface Account extends CustomerData {
  email: string;
  password: string;
}

export interface ShopData {
  product: {
    name: string;
    query: string;
    category: string;
    unitPrice: number;
    quantity: number;
    subtotal: number;
    total: number;
  };
  customer: CustomerData;
  paymentMethod: string;
}
