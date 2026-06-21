# Permanent Deployment

This wedding invitation needs a real host to be permanent and reachable worldwide.
The current local and Cloudflare quick-tunnel links stop working when the computer or tunnel stops.

## Recommended Simple Setup: Render

1. Create a GitHub repository and upload everything in this `outputs` folder.
2. Create a new Render Web Service from that repository.
3. Use these settings:
   - Runtime: Python
   - Build command: leave empty
   - Start command: `python server.py`
4. Add environment variables:
   - `ADMIN_CODE`: choose your private admin code
   - `RSVP_DATA_FILE`: `/var/data/rsvps.json`
5. Add a persistent disk:
   - Mount path: `/var/data`
   - Size: 1 GB is enough
6. Deploy.

Render will give you a permanent public URL like:

`https://your-service-name.onrender.com/`

Guest page:

`https://your-service-name.onrender.com/`

Admin page:

`https://your-service-name.onrender.com/admin.html`

## Important

- Keep the admin code private.
- Use a persistent disk or database, otherwise RSVP answers may disappear after redeploys.
- For a custom domain, add the domain in your hosting dashboard and update DNS.
