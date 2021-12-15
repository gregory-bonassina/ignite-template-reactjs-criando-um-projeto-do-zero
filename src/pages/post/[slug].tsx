import { GetStaticPaths, GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';
import Head from 'next/head';
import { FiCalendar, FiClock, FiLoader, FiUser } from 'react-icons/fi';
import { useRouter } from 'next/router';

import Header from '../../components/Header';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { formatDate } from '../../shared/dates';

interface Post {
    first_publication_date: string | null;
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
}

export default function Post({ post }: PostProps): JSX.Element {
    const router = useRouter();
    const { data } = post;
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

    const postWords = data.content.reduce(
        (acc, c) =>
            acc +
            c.heading.split(' ').length +
            RichText.asText(c.body).split(' ').length,
        0
    );

    const timeReading = Math.ceil(postWords / averageWordsPerMinute);

    return (
        <>
            <Head>
                <title>spacetraveling | {data.title}</title>
            </Head>
            <Header />
            <div className={styles.imgContainer}>
                <img
                    className={styles.banner}
                    src={data.banner.url}
                    alt="banner"
                />
            </div>
            <main className={commonStyles.container}>
                <div className={styles.post}>
                    <h1>{data.title}</h1>
                    <div className={styles.info}>
                        <time>
                            <FiCalendar />
                            {formatDate(post.first_publication_date)}
                        </time>
                        <span>
                            <FiUser />
                            {data.author}
                        </span>
                        <span>
                            <FiClock />
                            {`${timeReading} min`}
                        </span>
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

export const getStaticProps: GetStaticProps = async ({ params }) => {
    const { slug } = params;

    const prismic = getPrismicClient();
    const response = await prismic.getByUID('posts', String(slug), {});

    const post = {
        uid: response.uid,
        first_publication_date: response.first_publication_date,
        data: {
            ...response.data,
        },
    };

    return {
        props: {
            post,
        },
        revalidate: 60 * 30, // 30 minutes
    };
};
