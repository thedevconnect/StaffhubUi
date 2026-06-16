export interface UserDetails {
  name: string;
  email: string;
  role: string;
}

export interface SidebarMenuItem {
  label: string;
  icon?: string;
  route?: string;
  isOpen?: boolean;
  children?: SidebarMenuItem[];
}
