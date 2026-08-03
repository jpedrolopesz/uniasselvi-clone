/**
 * Espelha https://api-areasegura.uniasselvi.com.br/user/data
 * Nenhum JSON real foi enviado ainda para este endpoint — os campos e tipos
 * abaixo seguem exatamente a lista fornecida na especificação, com tipos
 * provisórios (a confirmar quando o JSON real chegar).
 */
export interface PoleInfo {
  epol_hour_saturday: string;
  epol_hour_week: string;
  pole_adress: string;
  pole_city: string;
  pole_district: string;
  pole_is_afiliated_to_hub: string;
  pole_is_hub: string;
  pole_name: string;
  pole_number: string;
  pole_phone: string;
  pole_state: string;
}

export interface UserDataRaw {
  specialization: string;
  student_grade: string;
  full_name: string;
  gender: string;
  admission_form: string;
  allow_spo_test: string;
  area: string;
  auth_age: number;
  auth_name: string;
  auth_profile: string;
  baae_type_specialization: string;
  birthday: string;
  city_code: string;
  city_name: string;
  city_state: string;
  classification: string;
  course_code: string;
  course_name: string;
  email: string;
  esem_code: string;
  first_name: string;
  graduated: string;
  group_auth: string;
  has_pending_documents: string;
  headquarter: string;
  is_laster_semester: string;
  is_mundial: string;
  is_simulation: string;
  leoapp_profile: string;
  menu_access: string;
  modality: string;
  modality_category: string;
  modality_description: string;
  module: string;
  needs_interpreter: string;
  objective_grade: string;
  only_free_courses: string;
  person: string;
  pole: string;
  pole_info: PoleInfo;
  prouni: string;
  registration_semester: string;
  semester: string;
  sex: string;
  status: string;
  status_description: string;
  status_semester: string;
  status_semester_description: string;
  subscription_code: string;
  type_of_course_description: string;
  username: string;
}
