import Datastore from 'nedb'
import path from 'path'
import { remote } from 'electron'

export default {
    videos: new Datastore({
        autoload: true,
        filename: path.join(remote.app.getPath('userData'), '/videos.db')
    }),
    artists: new Datastore({
        autoload: true,
        filename: path.join(remote.app.getPath('userData'), '/artists.db')
    }),
    companys: new Datastore({
        autoload: true,
        filename: path.join(remote.app.getPath('userData'), '/companys.db')
    }),
    tags: new Datastore({
        autoload: true,
        filename: path.join(remote.app.getPath('userData'), '/tags.db')
    }),
    categories: new Datastore({
        autoload: true,
        filename: path.join(remote.app.getPath('userData'), '/categories.db')
    }),
    playlist: new Datastore({
        autoload: true,
        filename: path.join(remote.app.getPath('userData'), '/playlist.db')
    }),
}