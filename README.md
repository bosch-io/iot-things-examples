# Sorry to write here, but .... where else ?

Seems like issues are disabled... so maybe this is the simplest way to contact you guys.

I'm having some issues with integrating your code using gradle.


buildscript {
    repositories {
        mavenCentral()
        maven {
            url "https://maven.bosch-si.com/content/repositories/bosch-releases"
        }
    }
}
   compile("com.bosch.iot.things:things-client:3.0.0.RC8")

I get the error 

~~~~
FAILURE: Build failed with an exception.

* What went wrong:
Could not resolve all dependencies for configuration 'detachedConfiguration5'.
> Could not find com.bosch.iot.things:things-client:3.0.0.RC8.
  Searched in the following locations:
      https://repo1.maven.org/maven2/com/bosch/iot/things/things-client/3.0.0.RC8/things-client-3.0.0.RC8.pom
      https://repo1.maven.org/maven2/com/bosch/iot/things/things-client/3.0.0.RC8/things-client-3.0.0.RC8.jar
  Required by:
      project :
      
 ~~~~
 
 Any ideas ?
