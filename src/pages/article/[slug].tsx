import type {
  GetStaticPaths,
  GetStaticPropsContext,
  InferGetStaticPropsType,
  NextPage,
} from "next";
import NavigationBar from "../../components/navigationBar";
import { sections } from "../../utils/section";
import { prisma } from "../../server/db/client";
import {
  serializeArticle,
  validateArticleBody,
  useDeserializeArticle,
} from "../../utils/article";
import { useMemo } from "react";
import Link from "next/link";
import ByLine from "../../components/byLine";
import Timestamp from "../../components/timestamp";
import Image from "next/image";
import CaptionedImage from "../../components/captionedImage";
import Head from "next/head";
import Balancer from "react-wrap-balancer";

export const getStaticPaths: GetStaticPaths = async () => {
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

export const getStaticProps = async (context: GetStaticPropsContext) => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const { slug } = context.params!;

  if (typeof slug !== "string")
    return {
      notFound: true,
    };

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
      thumbnail: { include: { contributor: true } },
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
    revalidate: 10,
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
      <Head>
        <title>{`${articleSection.display} | ${article.headline}`}</title>
        <meta name="description" content={article.focus} />
        <meta
          property="og:url"
          content={`https://thebullhorn.net/article/${article.slug}`}
        />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={article.headline} />
        <meta property="og:description" content={article.focus} />
        <meta
          property="twitter:url"
          content={`https://thebullhorn.net/article/${article.slug}`}
        />
        <meta property="twitter:title" content={article.headline} />
        <meta property="twitter:description" content={article.focus} />
        <link
          rel="canonical"
          href={`https://thebullhorn.net/article/${article.slug}`}
        />
        {article.thumbnail ? (
          <>
            <meta property="og:image" content={article.thumbnail.contentUrl} />
            <meta property="og:image:alt" content={article.thumbnail.alt} />
            <meta
              property="twitter:image"
              content={article.thumbnail.contentUrl}
            />
            <meta
              property="twitter:image:alt"
              content={article.thumbnail.alt}
            />
            <meta property="twitter:card" content="summary_large_image" />
          </>
        ) : null}
      </Head>
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
        <h1 className="my-2 text-center font-headline text-4xl font-semibold">
          <Balancer>{article.headline}</Balancer>
        </h1>

        <div className="flex justify-between text-sm">
          <ByLine writers={article.writers} />
          <p className="text-gray-400">
            <Timestamp timestamp={article.publicationDate} />
          </p>
        </div>

        <article className="mt-2 border-t-2 border-leman-blue">
          <div className="mx-auto mt-8 flex max-w-prose flex-col gap-2 font-serif text-lg">
            {article.thumbnail ? (
              <CaptionedImage
                className="mx-auto w-4/5"
                contributor={article.thumbnail.contributor}
                contributorText={article.thumbnail.contributorText}
                alt={article.thumbnail.alt}
              >
                <div className="relative h-0  pb-[66.6667%]">
                  <Image
                    priority
                    className="object-cover"
                    src={article.thumbnail.contentUrl}
                    alt={article.thumbnail.alt}
                    fill
                    sizes="80vw"
                  />
                </div>
              </CaptionedImage>
            ) : null}
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
                            className="link text-leman-blue"
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
                            contributorText={media.contributorText}
                            key={media.id}
                            alt={media.alt}
                            width={content.image.width}
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

export default ArticlePage;
