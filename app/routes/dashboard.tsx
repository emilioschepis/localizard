import { Dialog, Menu, Transition } from "@headlessui/react";
import { FolderIcon, MenuAlt2Icon, XIcon } from "@heroicons/react/outline";
import type { LoaderFunction, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, NavLink, Outlet, useLoaderData } from "@remix-run/react";
import { Fragment, useState } from "react";
import { useTranslation } from "react-i18next";

import { db } from "~/lib/db.server";
import i18next from "~/lib/i18n.server";
import { requireUserId } from "~/lib/session.server";
import { classNames } from "~/utils/style";

const navigation = [
  { name: "dashboard.title", href: "/dashboard", icon: FolderIcon },
];

type LoaderData = {
  title: string;
  email: string;
};

export const loader: LoaderFunction = async ({ request }) => {
  const t = await i18next.getFixedT(request);
  const userId = await requireUserId(request);
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });

  return json<LoaderData>({
    title: `${t("dashboard.title")} / ${t("name")}`,
    email: user.email,
  });
};

export const meta: MetaFunction = ({ data }) => {
  return {
    title: (data as LoaderData).title,
  };
};

export default function DashboardRoute() {
  const { t } = useTranslation();
  const data = useLoaderData<LoaderData>();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <div>
        <Transition.Root show={sidebarOpen} as={Fragment}>
          <Dialog
            as="div"
            className="relative z-40 md:hidden"
            onClose={setSidebarOpen}
          >
            <Transition.Child
              as={Fragment}
              enter="transition-opacity ease-linear duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="transition-opacity ease-linear duration-300"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
            </Transition.Child>

            <div className="fixed inset-0 z-40 flex">
              <Transition.Child
                as={Fragment}
                enter="transition ease-in-out duration-300 transform"
                enterFrom="-translate-x-full"
                enterTo="translate-x-0"
                leave="transition ease-in-out duration-300 transform"
                leaveFrom="translate-x-0"
                leaveTo="-translate-x-full"
              >
                <Dialog.Panel className="relative flex w-full max-w-xs flex-1 flex-col bg-white pt-5 pb-4">
                  <Transition.Child
                    as={Fragment}
                    enter="ease-in-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in-out duration-300"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <div className="absolute top-0 right-0 -mr-12 pt-2">
                      <button
                        type="button"
                        className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                        onClick={() => setSidebarOpen(false)}
                      >
                        <span className="sr-only">
                          {t("accessibility.close_sidebar")}
                        </span>
                        <XIcon
                          className="h-6 w-6 text-white"
                          aria-hidden="true"
                        />
                      </button>
                    </div>
                  </Transition.Child>
                  <div className="flex flex-shrink-0 items-center px-4">
                    <p
                      aria-hidden
                      className="text-xl font-bold text-emerald-700"
                    >
                      {t("name")}
                    </p>
                  </div>
                  <div className="mt-5 h-0 flex-1 overflow-y-auto">
                    <nav className="space-y-1 px-2">
                      {navigation.map((item) => (
                        <NavLink
                          key={item.name}
                          to={item.href}
                          className={({ isActive }) =>
                            classNames(
                              isActive
                                ? "bg-gray-100 text-gray-900"
                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                              "group flex items-center rounded-md px-2 py-2 text-base font-medium"
                            )
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <item.icon
                                className={classNames(
                                  isActive
                                    ? "text-gray-500"
                                    : "text-gray-400 group-hover:text-gray-500",
                                  "mr-4 h-6 w-6 flex-shrink-0"
                                )}
                                aria-hidden="true"
                              />
                              {t(item.name)}
                            </>
                          )}
                        </NavLink>
                      ))}
                    </nav>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
              <div className="w-14 flex-shrink-0" aria-hidden="true">
                {/* Dummy element to force sidebar to shrink to fit close icon */}
              </div>
            </div>
          </Dialog>
        </Transition.Root>

        {/* Static sidebar for desktop */}
        <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
          {/* Sidebar component, swap this element with another sidebar if you like */}
          <div className="flex flex-grow flex-col overflow-y-auto border-r border-gray-200 bg-white pt-5">
            <div className="flex flex-shrink-0 items-center px-4">
              <p aria-hidden className="text-xl font-bold text-emerald-700">
                {t("name")}
              </p>
            </div>
            <div className="mt-5 flex flex-grow flex-col">
              <nav className="flex-1 space-y-1 px-2 pb-4">
                {navigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={({ isActive }) =>
                      classNames(
                        isActive
                          ? "bg-gray-100 text-gray-900"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                        "group flex items-center rounded-md px-2 py-2 text-sm font-medium"
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon
                          className={classNames(
                            isActive
                              ? "text-gray-500"
                              : "text-gray-400 group-hover:text-gray-500",
                            "mr-3 h-6 w-6 flex-shrink-0"
                          )}
                          aria-hidden="true"
                        />
                        {t(item.name)}
                      </>
                    )}
                  </NavLink>
                ))}
              </nav>
            </div>
          </div>
        </div>
        <div className="flex flex-1 flex-col md:pl-64">
          <div className="sticky top-0 z-10 flex h-16 flex-shrink-0 bg-white shadow">
            <button
              type="button"
              className="border-r border-gray-200 px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-600 md:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="sr-only">{t("accessibility.open_sidebar")}</span>
              <MenuAlt2Icon className="h-6 w-6" aria-hidden="true" />
            </button>
            <div className="flex flex-1 justify-between px-4">
              <div className="flex flex-1"></div>
              <div className="ml-4 flex items-center md:ml-6">
                {/* Profile dropdown */}
                <Menu as="div" className="relative ml-3">
                  <div>
                    <Menu.Button className="flex max-w-xs items-center rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2">
                      <span className="sr-only">
                        {t("accessibility.open_user_menu")}
                      </span>
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300">
                        <p aria-hidden className="text-xl font-black uppercase">
                          {data.email[0]}
                        </p>
                      </div>
                    </Menu.Button>
                  </div>
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <Menu.Item>
                        {({ active }) => (
                          <Form method="post" action="/logout">
                            <button
                              type="submit"
                              className={classNames(
                                active ? "bg-gray-100" : "",
                                "block w-full px-4 py-2 text-sm text-gray-700"
                              )}
                            >
                              {t("auth.sign_out")}
                            </button>
                          </Form>
                        )}
                      </Menu.Item>
                    </Menu.Items>
                  </Transition>
                </Menu>
              </div>
            </div>
          </div>

          <main className="flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
}
