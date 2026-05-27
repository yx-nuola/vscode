import { Link } from 'react-router-dom';
import { WebviewRoutes } from '../../shared/messages';

export function HomePage() {
  return (
    <main className="home-page">
      <section className="home-page__header">
        <h1>VS Code Webview Workspace</h1>
        <p>Open the RRAM bitmap page in the panel or as an editor webview.</p>
      </section>
      <nav className="home-page__actions">
        <Link to={WebviewRoutes.bitmap}>RRAM Bitmap</Link>
      </nav>
    </main>
  );
}
