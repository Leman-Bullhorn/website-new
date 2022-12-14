import type {
  GetStaticPaths,
  GetStaticProps,
  InferGetStaticPropsType,
  NextPage,
} from "next";
import type { ParsedUrlQuery } from "querystring";
import NavigationBar from "../../components/navigationBar";
import { sections } from "../../utils/section";
import { prisma } from "../../server/db/client";
import {
  serializeArticle,
  validateArticleBody,
  useDeserializeArticle,
  type SerializableArticle,
  type ArticleBody,
} from "../../utils/article";
import { useMemo } from "react";
import type { Contributor, Media } from "@prisma/client";
import Link from "next/link";
import ByLine from "../../components/byLine";
import Timestamp from "../../components/timestamp";
import Image from "next/image";
import CaptionedImage from "../../components/captionedImage";

interface StaticParams extends ParsedUrlQuery {
  slug: string;
}

export const getStaticPaths: GetStaticPaths<StaticParams> = async () => {
  const recentArticles = await prisma.article.findMany({
    orderBy: {
      publicationDate: "desc",
    },
    select: {
      slug: true,
    },
    take: 50,
  });

  const paths = recentArticles.map((a) => ({ params: { slug: a.slug } }));

  return {
    fallback: "blocking",
    paths,
  };
};

export const getStaticProps: GetStaticProps<
  {
    serializedArticle: SerializableArticle & {
      writers: Contributor[];
      media: (Media & {
        contributor: Contributor | null;
      })[];
    };
    articleBody: ArticleBody;
  },
  StaticParams
> = async (context) => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const { slug } = context.params!;

  const article = await prisma.article.findUnique({
    where: {
      slug,
    },
    include: {
      writers: true,
      media: {
        include: {
          contributor: true,
        },
      },
    },
  });

  if (article == null)
    return {
      notFound: true,
    };

  const articleBody = validateArticleBody(article.body);

  if (articleBody == null)
    return {
      notFound: true,
    };

  const serializedArticle = serializeArticle(article);

  return {
    props: {
      serializedArticle,
      articleBody,
    },
  };
};

const ArticlePage: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({
  serializedArticle,
  articleBody,
}) => {
  const article = useDeserializeArticle(serializedArticle);

  const articleSection = useMemo(
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    () => sections.find((s) => s.dbSection === article.section)!,
    [article]
  );

  return (
    <>
      <NavigationBar />
      <div className="mx-auto mt-12 flex flex-col px-2 lg:max-w-[75%]">
        <div className="h-px w-full bg-black" />
        <p>
          <Link
            href={articleSection.href}
            className="link-hover font-section text-sm font-medium uppercase hover:text-leman-blue"
          >
            {articleSection.display}
          </Link>
        </p>
        <h1 className="my-2 text-center font-headline text-4xl font-bold">
          {article.headline}
        </h1>

        <div className="flex justify-between">
          <ByLine writers={article.writers} />
          <p className="text-gray-400">
            <Timestamp timestamp={article.publicationDate} />
          </p>
        </div>

        <article className="mt-2 border-t-2 border-leman-blue">
          <div className="mx-auto mt-8 max-w-prose font-serif text-lg">
            {articleBody.paragraphs.map((paragraph, idx) => (
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
                        const media = article.media.find(
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
                              width={parseInt(content.image.width)}
                              height={parseInt(content.image.height)}
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

export default ArticlePage;
