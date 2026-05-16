// 'use client';
// import * as React from 'react';
// import { GalleryVerticalEnd } from 'lucide-react';
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuTrigger,
//   DropdownMenuItem,
// } from '@/components/ui/dropdown-menu';
// import {
//   SidebarMenu,
//   SidebarMenuButton,
//   SidebarMenuItem
// } from '@/components/ui/sidebar';
//
// interface Tenant {
//   id: string;
//   name: string;
// }
//
// export function OrgSwitcher({
//                               tenants,
//                               defaultTenant,
//                               onTenantSwitch,
//                               isSidebarOpen
//                             }: {
//   tenants: Tenant[];
//   defaultTenant: Tenant;
//   onTenantSwitch?: (tenantId: string) => void;
//   isSidebarOpen: boolean;
// }) {
//   const [selectedTenant, setSelectedTenant] = React.useState<Tenant | undefined>(
//     defaultTenant || (tenants.length > 0 ? tenants[0] : undefined)
//   );
//
//   const handleTenantSwitch = (tenant: Tenant) => {
//     setSelectedTenant(tenant);
//     if (onTenantSwitch) {
//       onTenantSwitch(tenant.id);
//     }
//   };
//
//   if (!selectedTenant) {
//     return null;
//   }
//
//   return (
//     <SidebarMenu>
//       <SidebarMenuItem>
//         <DropdownMenu>
//           <DropdownMenuTrigger asChild>
//             <SidebarMenuButton
//               size="lg"
//               className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground w-full px-4"
//             >
//               <div className="flex items-center justify-center w-full h-12">
//                 {isSidebarOpen ? (
//                   <img
//                     src="/logo/logotalentf.svg"
//                     alt="Logo"
//                     className="w-full h-auto max-h-10 object-contain transition-all duration-300"
//                   />
//                 ) : (
//                   <img
//                     src="/logo/small-logo-black.svg"
//                     alt="Logo"
//                     className="w-8 h-8 object-contain transition-all duration-300"
//                   />
//                 )}
//               </div>
//             </SidebarMenuButton>
//           </DropdownMenuTrigger>
//           <DropdownMenuContent>
//             {tenants.map((tenant) => (
//               <DropdownMenuItem
//                 key={tenant.id}
//                 onSelect={() => handleTenantSwitch(tenant)}
//                 className="cursor-pointer"
//               >
//                 {tenant.name}
//               </DropdownMenuItem>  
//             ))}
//           </DropdownMenuContent>
//         </DropdownMenu>
//       </SidebarMenuItem>
//     </SidebarMenu>
//   );
// }