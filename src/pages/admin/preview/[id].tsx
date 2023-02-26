import type {
  GetServerSidePropsContext,
  InferGetServerSidePropsType,
  NextPage,
} from "next";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo } from "react";
import ByLine from "../../../components/byLine";
import CaptionedImage from "../../../components/captionedImage";
import NavigationBar from "../../../components/navigationBar";
import Timestamp from "../../../components/timestamp";
import { prisma } from "../../../server/db/client";
import { validateArticleBody } from "../../../utils/article";
import { sections } from "../../../utils/section";
import { trpc } from "../../../utils/trpc";

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const { id } = ctx.params as { id: string };

  const submission = await prisma.articleSubmission.findUnique({
    where: {
      id,
    },
    include: {
      media: {
        include: {
          contributor: true,
        },
      },
      writers: true,
    },
  });

  if (submission == null)
    return {
      notFound: true,
    };
  const submissionBody = validateArticleBody(submission.body);

  if (submissionBody == null)
    return {
      notFound: true,
    };

  return {
    props: {
      submission,
      submissionBody,
    },
  };
};

const PreviewPage: NextPage<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = ({ submission, submissionBody }) => {
  // const previewContent = generateArticlePageBody({articleMedia: submission.});
  // const section = useMemo(
  //   // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  //   () => sections.find((s) => s.dbSection === submission.section)!,
  //   [submission]
  // );
  const { data: allWriters } = trpc.contributor.all.useQuery();

  const router = useRouter();
  // let { headline, section, writers } = router.query;

  const headline = router.query.headline ?? submission.headline;
  const section = useMemo(
    () =>
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      sections.find(
        (s) => s.dbSection === router.query.section ?? submission.section
      )!,
    [router.query.section, submission.section]
  );

  const writers = useMemo(() => {
    const queryWriters = router.query.writers;
    if (queryWriters == null || allWriters == null) {
      return submission.writers;
    }
    return allWriters.filter((w) => queryWriters.includes(w.id));
  }, [allWriters, router.query.writers, submission.writers]);

  console.log(writers);

  return (
    <>
      <NavigationBar />
      <div className="mx-auto mt-12 flex flex-col px-2 lg:max-w-[75%]">
        <div className="h-px w-full bg-black" />
        <p>
          <Link
            href={section.href}
            className="link-hover font-section text-sm font-medium uppercase hover:text-leman-blue"
          >
            {section.display}
          </Link>
        </p>
        <h1 className="my-2 text-center font-headline text-4xl font-semibold">
          {headline}
        </h1>

        <div className="flex justify-between">
          <ByLine writers={writers} />
          <p className="text-gray-400">
            <Timestamp timestamp={new Date()} />
          </p>
        </div>

        <article className="mt-2 border-t-2 border-leman-blue">
          <div className="mx-auto mt-8 flex max-w-prose flex-col gap-2 font-serif text-lg">
            {submissionBody.paragraphs.map((paragraph, idx) => (
              <div
                key={idx}
                style={{
                  marginLeft: paragraph.marginLeft,
                  marginRight: paragraph.marginRight,
                  textAlign:
                    paragraph.textAlignment as React.CSSProperties["textAlign"],
                  textIndent: paragraph.textIndent,
                }}
              >
                {paragraph.spans.map((span, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontStyle: span.fontStyle,
                      textDecoration: span.textDecoration,
                      color: span.color,
                      fontWeight: span.fontWeight,
                    }}
                  >
                    {span.content.map((content) => {
                      if ("text" in content) {
                        return (
                          <span
                            key={content.text.content}
                            dangerouslySetInnerHTML={{
                              __html: content.text.content,
                            }}
                          />
                        );
                      } else if ("anchor" in content) {
                        return (
                          <a
                            className="link-hover link text-leman-blue"
                            href={content.anchor.href}
                            key={content.anchor.href}
                            rel="noreferrer"
                            target="_blank"
                            dangerouslySetInnerHTML={{
                              __html: content.anchor.content,
                            }}
                          />
                        );
                      } else if ("image" in content) {
                        const media = submission.media.find(
                          (m) => m.id === content.image.mediaId
                        );

                        if (media == null) return null;

                        return (
                          <CaptionedImage
                            className="inline-block"
                            contributor={media.contributor}
                            key={media.id}
                          >
                            <Image
                              className="overflow-hidden"
                              src={media.contentUrl}
                              alt={media.alt}
                              width={content.image.width}
                              height={content.image.height}
                            />
                          </CaptionedImage>
                        );
                      }
                    })}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </article>
      </div>
    </>
  );
};

export default PreviewPage;
