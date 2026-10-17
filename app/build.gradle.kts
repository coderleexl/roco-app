plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

val prepareRuffle by tasks.registering(Exec::class) {
    workingDir(rootDir)
    commandLine("python", "tools/prepare_ruffle.py")
    inputs.files(rootProject.file("tools/prepare_ruffle.py"), rootProject.file("third-party/ruffle.json"))
    outputs.dir(layout.buildDirectory.dir("generated/ruffleAssets"))
}

android {
    namespace = "io.github.coderleexl.rocoapp"
    compileSdk = 36
    defaultConfig {
        applicationId = "io.github.coderleexl.rocoapp"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "0.1.0"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        ndk { abiFilters += listOf("arm64-v8a", "x86_64") }
    }
    buildFeatures { buildConfig = true }
    compileOptions { sourceCompatibility = JavaVersion.VERSION_17; targetCompatibility = JavaVersion.VERSION_17 }
    kotlinOptions { jvmTarget = "17" }
    sourceSets.getByName("main").assets.srcDir(layout.buildDirectory.dir("generated/ruffleAssets"))
    packaging { resources.excludes += "/META-INF/{AL2.0,LGPL2.1}" }
    lint { abortOnError = true }
}
tasks.named("preBuild").configure { dependsOn(prepareRuffle) }
dependencies {
    implementation("org.mozilla.geckoview:geckoview:158.0.20261007201254")
    implementation("androidx.activity:activity-ktx:1.10.1")
    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test:runner:1.6.2")
    androidTestImplementation("androidx.test:rules:1.6.1")
    androidTestImplementation("androidx.test.ext:junit:1.2.1")
}
