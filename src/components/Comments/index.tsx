export function Comments(): JSX.Element {
    return (
        <section
            style={{ width: '100%' }}
            ref={element => {
                if (!element) {
                    return;
                }

                const scriptElement = document.createElement('script');
                scriptElement.setAttribute(
                    'src',
                    'https://utteranc.es/client.js'
                );
                scriptElement.setAttribute(
                    'repo',
                    'gregory-bonassina/ignite-template-reactjs-criando-um-projeto-do-zero'
                );
                scriptElement.setAttribute('issue-term', 'pathname');
                scriptElement.setAttribute('theme', 'photon-dark');
                scriptElement.setAttribute('crossorigin', 'anonymous');
                scriptElement.setAttribute('async', 'true');
                element.replaceChildren(scriptElement);
            }}
        />
    );
}