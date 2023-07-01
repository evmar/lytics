async function log() {
    const log = {
        path: document.location.pathname,
        referer: document.referer,
        agent: navigator.userAgent,
    };
    await fetch('/lytics.cgi', {
        method: 'POST',
        body: JSON.stringify(log),
    });
}
log();