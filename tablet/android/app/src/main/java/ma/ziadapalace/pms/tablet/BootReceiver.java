package ma.ziadapalace.pms.tablet;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

// Relance automatiquement l'app tablette après un redémarrage/coupure de courant,
// pour que le personnel n'ait jamais à rallumer l'app manuellement dans une chambre.
public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) {
            Intent launch = new Intent(context, MainActivity.class);
            launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(launch);
        }
    }
}
