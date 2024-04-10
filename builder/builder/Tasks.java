/*
 * Author: Blake McBride
 * Date: 2/16/20
 *
 * I've found that I spend more time messing with build programs (such as Maven, Gradle, and others) than
 * the underlying application I am trying to build.  They all do the normal things very, very easily.
 * But when you try to go off their beaten path it gets real difficult real fast.  Being sick and
 * tired of this, and having easily built a shell script to build what I want, I needed a more portable
 * solution.  The files in this directory are that solution.
 *
 * There are two classes as follows:
 *
 *     BuildUtils -  the generic utilities needed to build
 *     Tasks      -  the application-specific build procedures (or tasks)
 *
 *    Non-private instance methods with no parameters are considered tasks.
 */


package builder;

import static builder.BuildUtils.*;
import java.util.Date;
import java.util.UUID;

public class Tasks {

	void clean() {
		rmRegex(".", ".+\\.png$");
		rmRegex("builder/builder", ".+\\.class$");
		rm("favicon.ico");
	}

	void configVeteranBase() {
		clean();
		copyRegex("WhiteLabel/VeteranBase", ".", null, null, true);
	}

	void configStack360() {
		clean();
		copyRegex("WhiteLabel/Stack360", ".", null, null, true);
	}
    
    static void makeIndexHTML() {
        runShell("sed -e 's/const controlCache = false;/const controlCache = true;/' index.html >index.html.tmp");
        
        String cmd = "sed -e 's/const softwareVersion = \"[^\"]*\"/const softwareVersion = \"";
        cmd += UUID.randomUUID();
        cmd += "\"/' index.html.tmp >index.html";
        runShell(cmd);
        
        cmd = "sed -e 's/const releaseDate = \"[^\"]*\"/const releaseDate = \"";
        cmd += new Date();
        cmd += "\"/' index.html >index.html.tmp";
        runShell(cmd);
        
        move("index.html.tmp", "index.html");
    }
    
    static void sed(String fileName, String cmd) {
        runShell("sed -e '" + cmd + "' " + fileName + " >" + fileName + ".tmp");
        move(fileName + ".tmp", fileName);
    }
    
    void updateDemo() {
        configStack360();
        makeIndexHTML();
        sed("framework.js", "s/[^\\/]AWS.setURL/ \\/\\/AWS.setURL/");
        
        sed("framework.js", "/demo.stack360.io/s/\\/\\///");
        
        rm("../Stack360Frontend.tar.gz");
        rm("Stack360Frontend.tar.gz");
        runShell("tar czf ../Stack360Frontend.tar.gz --exclude=Stack360Frontend.iml --exclude=makedist --exclude=serve --exclude=SimpleWebServer.jar --exclude=notes --exclude=builder --exclude=WhiteLabel --exclude=build.xml *");
        move("../Stack360Frontend.tar.gz", "Stack360Frontend.tar.gz");
        
        runWait(true, "scp Stack360Frontend.tar.gz root@admin.stack360.io:DemoFrontend.tar.gz");
        configStack360();  // reset system back to development environment
    }
    
    void updateAdmin() {
        configStack360();
        makeIndexHTML();
        sed("framework.js", "s/[^\\/]AWS.setURL/ \\/\\/AWS.setURL/");
        
        sed("framework.js", "/admin.stack360.io/s/\\/\\///");
        
        rm("../Stack360Frontend.tar.gz");
        rm("Stack360Frontend.tar.gz");
        runShell("tar czf ../Stack360Frontend.tar.gz --exclude=Stack360Frontend.iml --exclude=makedist --exclude=serve --exclude=SimpleWebServer.jar --exclude=notes --exclude=builder --exclude=WhiteLabel --exclude=build.xml *");
        move("../Stack360Frontend.tar.gz", "Stack360Frontend.tar.gz");
        
        runWait(true, "scp Stack360Frontend.tar.gz root@admin.stack360.io:AdminFrontend.tar.gz");
        configStack360();  // reset system back to development environment
    }
    
    void updateDemoAdmin() {
        updateDemo();
        updateAdmin();
    }

    void updateWayToGo() {
        configStack360();
        makeIndexHTML();
        sed("framework.js", "s/[^\\/]AWS.setURL/ \\/\\/AWS.setURL/");

        sed("framework.js", "/waytogo.arahant.com/s/\\/\\///");

        rm("Stack360Frontend.jar");
        rmTree("dist");
        mkdir("dist");
        runShell("rsync -av --exclude='dist' ./ dist/");
        rmTree("dist/.svn");



//        rm("../Stack360Frontend.tar.gz");
//        rm("Stack360Frontend.tar.gz");
//        runShell("tar czf ../Stack360Frontend.tar.gz --exclude=Stack360Frontend.iml --exclude=makedist --exclude=serve --exclude=SimpleWebServer.jar --exclude=notes --exclude=builder --exclude=WhiteLabel --exclude=build.xml --exclude=Stack360Frontend.jar *");
//        move("../Stack360Frontend.tar.gz", "Stack360Frontend.tar.gz");
//
//        runWait(true, "scp Stack360Frontend.tar.gz root@waytogo.arahant.com:");
//        configStack360();  // reset system back to development environment
    }

}
