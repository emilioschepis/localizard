import { PencilIcon, PlusIcon } from "@heroicons/react/outline";
import type { PrismaPromise } from "@prisma/client";
import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form, Link, useLoaderData, useLocation } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import { db } from "~/lib/db.server";
import { requireUserId } from "~/lib/session.server";
import { badRequest, notFound } from "~/utils/responses";

type LoaderData = {
  label: NonNullable<Awaited<ReturnType<typeof getLabel>>>;
};

async function getLabel(id: string) {
  return db.label.findUnique({
    where: { id },
    select: {
      id: true,
      key: true,
      description: true,
      project: {
        select: {
          userId: true,
          name: true,
          locales: {
            orderBy: { name: "asc" },
            select: {
              id: true,
              name: true,
              translations: {
                where: { labelId: id },
                take: 1,
                select: {
                  id: true,
                  value: true,
                },
              },
            },
          },
        },
      },
    },
  });
}

export const action: ActionFunction = async ({ request, params }) => {
  const userId = await requireUserId(request);
  const label = await getLabel(params.labelId as string);

  if (!label || label.project.userId !== userId) {
    throw notFound();
  }

  const form = await request.formData();
  const intent = form.get("intent");

  if (intent === "update") {
    const operations: Array<PrismaPromise<any>> = [];

    for (const [key, value] of form) {
      if (!key.startsWith("locale.")) {
        // SKip non-locale keys
        continue;
      }

      const localeId = key.replace("locale.", "");

      if (typeof value !== "string") {
        continue;
      }

      const locale = label.project.locales.find(
        (locale) => locale.id === localeId
      );

      // Do not update non-existent locales
      if (!locale) {
        continue;
      }

      const translation = locale.translations[0];

      // Do not update translations that haven't changed
      if (translation && translation.value === value) {
        continue;
      }

      if (translation) {
        operations.push(
          db.translation.update({
            where: { id: translation.id },
            data: { value },
          })
        );
      } else {
        operations.push(
          db.translation.create({
            data: { labelId: label.id, localeId, value },
          })
        );
      }
    }

    await db.$transaction(operations);

    return redirect(`dashboard/${label.project.name}`);
  }

  if (intent === "delete") {
    await db.label.delete({ where: { id: label.id } });

    return redirect(`dashboard/${label.project.name}`);
  }

  throw badRequest({});
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const userId = await requireUserId(request);
  const label = await getLabel(params.labelId as string);

  if (!label || label.project.userId !== userId) {
    throw notFound();
  }

  return { label };
};

export default function LabelRoute() {
  const { t } = useTranslation();
  const location = useLocation();
  const data = useLoaderData<LoaderData>();

  return (
    <div className="py-4">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <div className="flex items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              {data.label.key}
            </h2>
            <Link to="edit" type="button" className="ml-2">
              <PencilIcon
                className="h-5 w-5 text-emerald-700"
                aria-label={t("accessibility.edit_label")}
              />
            </Link>
          </div>
          <p className="mt-2 text-sm text-gray-700">
            {data.label.description || (
              <span className="italic">
                {t("page.project.label.no_description")}
              </span>
            )}
          </p>
        </div>
      </div>
      {data.label.project.locales.length > 0 ? (
        <Form method="post">
          <div className="mt-4 flex flex-col">
            <input type="hidden" name="intent" value="update" />
            {data.label.project.locales.map((locale) => {
              const translation = locale.translations[0]?.value;

              return (
                <div key={locale.id} className="mb-4">
                  <label
                    htmlFor={locale.id}
                    className="block text-sm font-medium text-gray-700"
                  >
                    {locale.name}
                  </label>
                  <div className="relative mt-1 rounded-md shadow-sm">
                    <input
                      type="text"
                      id={locale.id}
                      name={`locale.${locale.id}`}
                      defaultValue={translation}
                      placeholder={t(
                        "page.project.label.translation_placeholder",
                        { locale: locale.name }
                      )}
                      className="block w-full rounded-md  border-gray-300 pr-10  shadow-sm  focus:border-emerald-600 focus:outline-none  focus:ring-emerald-600 sm:text-sm"
                    />
                  </div>
                </div>
              );
            })}
            <button
              type="submit"
              className="inline-flex justify-center self-end rounded-md border border-transparent bg-emerald-700 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2"
            >
              {t("page.project.label.update_cta")}
            </button>
          </div>
        </Form>
      ) : (
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {t("page.project.label.no_locales_title")}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {t("page.project.label.no_locales_description")}
          </p>
          <div className="mt-6">
            <Link
              type="button"
              to={`../locales/create-locale?redirectTo=${location.pathname}`}
              className="inline-flex items-center rounded-md border border-transparent bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              {t("page.project.label.create_locale_cta")}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
