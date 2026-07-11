import * as Icons from "../icons";

export const NAV_DATA = [
  {
    label: "mainMenu",
    items: [
      {
        title: "Dashboard",
        langKey: "dashboard",
        icon: Icons.HomeIcon,
        url: "/",
        items: [],
      },
      {
        title: "Camps",
        langKey: "camps",
        icon: Icons.Table,
        url: "/dashboard/camps",
        items: [],
      },
      {
        title: "Families",
        langKey: "families",
        icon: Icons.User,
        url: "/dashboard/families",
        items: [],
      },
      {
        title: "Aid Types",
        langKey: "aidTypes",
        icon: Icons.Alphabet,
        url: "/dashboard/aid-types",
        items: [],
      },
      {
        title: "Aid Providers",
        langKey: "providers",
        icon: Icons.PieChart,
        url: "/dashboard/providers",
        items: [],
      },
    ],
  },
  {
    label: "adminMenu",
    adminOnly: true,
    items: [
      {
        title: "User Management",
        langKey: "users",
        icon: Icons.User,
        adminOnly: true,
        items: [
          {
            title: "Users List",
            langKey: "users",
            url: "/dashboard/users",
          },
          {
            title: "Add User",
            langKey: "add",
            url: "/dashboard/users/new",
          },
        ],
      },
      {
        title: "Settings",
        langKey: "settings",
        icon: Icons.Alphabet,
        adminOnly: true,
        items: [
          {
            title: "Change Password",
            langKey: "changePassword",
            url: "/dashboard/settings/change-password",
          },
        ],
      },
    ],
  },
];
