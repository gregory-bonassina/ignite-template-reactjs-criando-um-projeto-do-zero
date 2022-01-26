import { GetStaticPaths, GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';
import Head from 'next/head';
import { FiCalendar, FiClock, FiLoader, FiUser } from 'react-icons/fi';
import { useRouter } from 'next/router';

import Link from 'next/link';
import Header from '../../components/Header';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { formatDate, formatDateTime } from '../../shared/dates';
import { Comments } from '../../components/Comments';

interface Post {
    uid: string;
    first_publication_date: string | null;
    last_publication_date: string | null;
    data: {
        title: string;
        banner: {
            url: string;
        };
        author: string;
        content: {
            heading: string;
            body: {
                text: string;
            }[];
        }[];
    };
}

interface PostProps {
    post: Post;
    previousPost: Post;
    nextPost: Post;
    preview: boolean;
}

export default function Post({
    post,
    preview,
    previousPost,
    nextPost,
}: PostProps): JSX.Element {
    const router = useRouter();
    const averageWordsPerMinute = 200;

    if (router.isFallback) {
        return (
            <>
                <main className={styles.loading}>
                    <FiLoader />
                    <span>Carregando...</span>
                </main>
            </>
        );
    }

    const postWords = post.data.content.reduce(
        (acc, c) =>
            acc +
            c.heading.split(' ').length +
            RichText.asText(c.body).split(' ').length,
        0
    );

    const timeReading = Math.ceil(postWords / averageWordsPerMinute);

    function getUpdatedAt(date: string): string {
        const splitDate = date.split(' ');

        let dt = splitDate[0];
        dt = dt.split('/').join(' ');

        const time = splitDate[1];

        return `* editado em ${dt}, às ${time}`;
    }

    return (
        <>
            <Head>
                <title>spacetraveling | {post.data.title}</title>
            </Head>
            <Header />
            <div className={styles.imgContainer}>
                <img
                    className={styles.banner}
                    src={post.data.banner.url}
                    alt="banner"
                />
            </div>
            <main className={commonStyles.container}>
                <div className={styles.post}>
                    <h1>{post.data.title}</h1>
                    <div className={styles.info}>
                        <time>
                            <FiCalendar />
                            {formatDate(post.first_publication_date)}
                        </time>
                        <span>
                            <FiUser />
                            {post.data.author}
                        </span>
                        <span>
                            <FiClock />
                            {`${timeReading} min`}
                        </span>
                    </div>
                    <div className={styles.updatedInfo}>
                        {getUpdatedAt(
                            formatDateTime(post.last_publication_date)
                        )}
                    </div>
                    {post.data.content.map(content => (
                        <div
                            key={content.heading}
                            className={styles.postContent}
                        >
                            <p className={styles.contentHeading}>
                                {content.heading}
                            </p>
                            <div
                                // eslint-disable-next-line react/no-danger
                                dangerouslySetInnerHTML={{
                                    __html: RichText.asHtml(content.body),
                                }}
                            />
                        </div>
                    ))}

                    <div className={styles.divider} />

                    <div className={styles.otherPostsContainer}>
                        <div>
                            {previousPost && (
                                <>
                                    <span>{previousPost.data.title}</span>
                                    <Link
                                        key={previousPost.uid}
                                        href={`/post/${previousPost.uid}`}
                                    >
                                        <a>Post anterior</a>
                                    </Link>
                                </>
                            )}
                        </div>

                        <div>
                            {nextPost && (
                                <>
                                    <span>{nextPost.data.title}</span>
                                    <Link
                                        key={nextPost.uid}
                                        href={`/post/${nextPost.uid}`}
                                    >
                                        <a>Próximo post</a>
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>

                    <Comments />

                    {preview && (
                        <aside className={styles.previewMode}>
                            <Link href="/api/exit-preview">
                                <a>Sair do modo Preview</a>
                            </Link>
                        </aside>
                    )}
                </div>
            </main>
        </>
    );
}

export const getStaticPaths: GetStaticPaths = async () => {
    const prismic = getPrismicClient();
    const posts = await prismic.query(
        [Prismic.predicates.at('document.type', 'posts')],
        {
            pageSize: 1,
        }
    );

    const paths = posts.results.map(result => ({
        params: { slug: result.uid },
    }));

    return {
        paths,
        fallback: true,
    };
};

export const getStaticProps: GetStaticProps = async ({
    params,
    preview = false,
    previewData,
}) => {
    const { slug } = params;

    const prismic = getPrismicClient();

    const response = await prismic.getByUID('posts', String(slug), {
        ref: previewData?.ref ?? null,
    });

    const posts = await prismic.query(
        [Prismic.predicates.at('document.type', 'posts')],
        {}
    );

    const index = posts.results.findIndex(post => post.uid === response.uid);

    const previousPostResponse = index > 0 ? posts.results[index - 1] : null;

    const nextPostResponse =
        index === posts.results.length - 1 ? null : posts.results[index + 1];

    const post = {
        uid: response.uid,
        first_publication_date: response.first_publication_date,
        last_publication_date: response.last_publication_date,
        data: {
            ...response.data,
        },
    };

    let previousPost = null;
    let nextPost = null;

    if (previousPostResponse) {
        previousPost = {
            uid: previousPostResponse.uid,
            first_publication_date: previousPostResponse.first_publication_date,
            last_publication_date: previousPostResponse.last_publication_date,
            data: {
                ...previousPostResponse.data,
            },
        };
    }

    if (nextPostResponse) {
        nextPost = {
            uid: nextPostResponse.uid,
            first_publication_date: nextPostResponse.first_publication_date,
            last_publication_date: nextPostResponse.last_publication_date,
            data: {
                ...nextPostResponse.data,
            },
        };
    }

    return {
        props: {
            post,
            preview,
            previousPost,
            nextPost,
        },
        revalidate: 60 * 30, // 30 minutes
    };
};
