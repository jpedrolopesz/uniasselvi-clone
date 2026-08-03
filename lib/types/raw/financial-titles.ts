/**
 * Espelha https://api-ava.uniasselvi.com.br/financial/title/get
 */
export interface FinancialTitleRaw {
  title_type: string;
  semester: string;
  our_number: string;
  billing_type: string;
  can_print_billet: string;
  charge_type: string;
  class_titu: string;
  date_today: string;
  difference_value: number;
  down_type: string;
  due_date: string;
  due_today: string;
  headquarter: string;
  invoice_link: string;
  invoice_number: string;
  is_reenrollment: string;
  paid: string;
  paid_date: string;
  paid_value: number;
  parcel: string;
  parcel_description: string;
  parcel_semester: string;
  payment_type: string;
  period_code: string;
  person_code: string;
  punctuality: string;
  return_value: number;
  return_year: string;
  status: string;
  student_code: string;
  total_value: number;
  value_today: number;
}
