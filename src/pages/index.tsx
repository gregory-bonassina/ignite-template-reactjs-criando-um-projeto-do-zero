import { GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import Head from 'next/head';
import Link from 'next/link';
import { FiCalendar, FiUser } from 'react-icons/fi';

import { useState } from 'react';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import Header from '../components/Header';
import { formatDate } from '../shared/dates';

interface Post {
    uid?: string;
    first_publication_date: string | null;
    data: {
        title: string;
        subtitle: string;
        author: string;
    };
}

interface PostPagination {
    next_page: string;
    results: Post[];
}

interface HomeProps {
    postsPagination: PostPagination;
}

function parseResult(result: any[]): Post[] {
    return result.map(post => ({
        uid: post.uid,
        first_publication_date: post.first_publication_date,
        data: {
            ...post.data,
        },
    }));
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
    const [loadingMore, setLoadingMore] = useState(false);
    const [posts, setPosts] = useState<Post[]>(postsPagination.results);
    const [nextPage, setNextPage] = useState(postsPagination.next_page);

    const loadMorePosts = async (): Promise<void> => {
        setLoadingMore(true);

        await fetch(nextPage)
            .then(result => result.json())
            .then(response => {
                setPosts([...posts, ...parseResult(response.results)]);
                setNextPage(response.next_page);
                setLoadingMore(false);
            })
            .catch(err => {
                setLoadingMore(false);
                // eslint-disable-next-line no-alert
                alert(`Error fetching more posts: ${err.message}`);
            });
    };

    return (
        <>
            <Head>
                <title>Posts | spacetraveling.</title>
            </Head>

            <main className={commonStyles.container}>
                <Header />
                <div className={styles.posts}>
                    {posts.map(post => (
                        <Link key={post.uid} href={`/post/${post.uid}`}>
                            <a>
                                <strong>{post.data.title}</strong>
                                <p>{post.data.subtitle}</p>
                                <div>
                                    <time>
                                        <FiCalendar />
                                        {formatDate(
                                            post.first_publication_date
                                        )}
                                    </time>
                                    <span>
                                        <FiUser />
                                        {post.data.author}
                                    </span>
                                </div>
                            </a>
                        </Link>
                    ))}
                </div>
                {!!nextPage && (
                    <div className={styles.buttonContainer}>
                        <button
                            type="button"
                            disabled={loadingMore}
                            onClick={() => loadMorePosts()}
                        >
                            {loadingMore
                                ? 'Carregando....'
                                : 'Carregar mais posts'}
                        </button>
                    </div>
                )}
            </main>
        </>
    );
}

export const getStaticProps: GetStaticProps = async ({
    preview = false,
    previewData,
}) => {
    const prismic = getPrismicClient();

    const response = await prismic.query(
        [Prismic.predicates.at('document.type', 'posts')],
        {
            pageSize: 1,
            ref: previewData?.ref ?? null,
        }
    );

    const posts: Post[] = parseResult(response.results);

    return {
        props: {
            postsPagination: {
                next_page: response.next_page,
                results: posts,
            },
            preview,
        },
        revalidate: 60 * 60 * 24, // 24 hours
    };
};
