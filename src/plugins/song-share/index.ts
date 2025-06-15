import { createPlugin } from '@/utils';
import { t } from '@/i18n';
import { getSongInfo } from '@/providers/song-info-front';

type ShareFormat = 'title-url' | 'title-only' | 'url-only';

export default createPlugin({
  name: () => t('plugins.song-share.name'),
  description: () => t('plugins.song-share.description'),
  restartNeeded: false,
  config: {
    enabled: false,
    format: 'title-url' as ShareFormat,
  },
  menu: async ({ getConfig, setConfig }) => [
    {
      label: t('plugins.song-share.menu.format'),
      submenu: [
        {
          label: t('plugins.song-share.menu.titleAndUrl'),
          type: 'radio',
          checked: (await getConfig()).format === 'title-url',
          click: () => setConfig({ format: 'title-url' as ShareFormat }),
        },
        {
          label: t('plugins.song-share.menu.titleOnly'),
          type: 'radio',
          checked: (await getConfig()).format === 'title-only',
          click: () => setConfig({ format: 'title-only' as ShareFormat }),
        },
        {
          label: t('plugins.song-share.menu.urlOnly'),
          type: 'radio',
          checked: (await getConfig()).format === 'url-only',
          click: () => setConfig({ format: 'url-only' as ShareFormat }),
        },
      ],
    },
  ],
  renderer: {
    start({ getConfig }) {
      const addShareButton = () => {
        const buttonContainer = document.querySelector(
          '.middle-controls-buttons',
        );
        if (!buttonContainer || document.querySelector('#song-share-button')) {
          return;
        }

        const shareButton = document.createElement('tp-yt-paper-icon-button');
        shareButton.id = 'song-share-button';
        shareButton.className = 'style-scope ytmusic-player-bar';
        shareButton.setAttribute('aria-label', 'Share song with title');
        shareButton.style.cssText = `
          color: var(--yt-spec-text-secondary);
          --paper-icon-button-ink-color: var(--yt-spec-text-secondary);
          cursor: pointer;
          margin: 0 8px;
        `;

        shareButton.innerHTML = `
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
          </svg>
        `;

        shareButton.addEventListener('click', async () => {
          try {
            const config = await getConfig();
            const songInfo = getSongInfo();

            if (!songInfo || !songInfo.title) {
              // Toast notification using the global API
              if (typeof window !== 'undefined' && 'toastService' in window) {
                (window as any).toastService?.show?.(
                  '楽曲情報を取得できませんでした',
                );
              }
              return;
            }

            let textToCopy = '';
            const title = songInfo.title || '不明な楽曲';
            const artist = songInfo.artist || '不明なアーティスト';
            const url =
              songInfo.url ||
              `https://music.youtube.com/watch?v=${songInfo.videoId}`;

            switch (config.format) {
              case 'title-only': {
                textToCopy = `${title} - ${artist}`;
                break;
              }
              case 'url-only': {
                textToCopy = url;
                break;
              }
              case 'title-url':
              default: {
                textToCopy = `${title} - ${artist}\n${url}`;
                break;
              }
            }

            await navigator.clipboard.writeText(textToCopy);
            
            if (typeof window !== 'undefined' && 'toastService' in window) {
              (window as any).toastService?.show?.('楽曲情報をコピーしました');
            }

            shareButton.style.color = 'var(--yt-spec-call-to-action)';
            setTimeout(() => {
              shareButton.style.color = 'var(--yt-spec-text-secondary)';
            }, 1000);
          } catch (error) {
            console.error('Copy failed:', error);
            if (typeof window !== 'undefined' && 'toastService' in window) {
              (window as any).toastService?.show?.('コピーに失敗しました');
            }
          }
        });

        buttonContainer.appendChild(shareButton);
      };

      const observer = new MutationObserver(() => {
        addShareButton();
      });

      addShareButton();

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      return () => {
        observer.disconnect();
        const shareButton = document.querySelector('#song-share-button');
        shareButton?.remove();
      };
    },
  },
});