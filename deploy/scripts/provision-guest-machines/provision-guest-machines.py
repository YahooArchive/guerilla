import os
from plumbum import cli, local, FG, BG
import socket


class ProvisionGuestMachinesCLI(cli.Application):
    # 

    #


    hostname = cli.Flag("-h", default = socket.gethostname(), help = "Overrides the HOSTNAME environment variable")
    guerillaConfigRoot = cli.Flag("-c", default = os.path.join("~", "Workspace", "guerilla", "deploy", "config", hostname), help = "Guerilla configuration root")
    guerillaConfigRoot = os.path.expanduser(guerallConfigRoot); # handles optional leading '~'
    guerillaConfigRoot = os.path.expandvars(guerillaConfigRoot); # Expands $var and ${var} env vars
    vmdir = cli.Flag("v", default = os.path.join(guerillaConfigRoot, "vmdir"), help = "Directory with virtual machines"
     



    def main(self):
        #hostName = cli.SwitchAttr("-hostName", str, default = local.env["HOSTNAME"] )
        print hostname, guerillaConfigRoot
        print self.hostname   #hostname is not available in local due to portability issue with hostname
        sgi = ProvisionGuestMachines(self.hostname, self.guerillaConfigRoot)
        sgi.start()


#class StartGuerillaFromENV(cli.Application):



class ProvisionGuestMachines():

        def __init__(self, start_master, start_worker, start_redis, hostname):
            self.start_master = start_master
            self.start_worker = start_worker
            self.start_redis  = start_redis
            self.hostname = hostname

        def start(self):
            #TODO:bruceg refresh guerilla and do npm install. Out of scope for now
            if self.start_master:
                #ideally we could run as a background process, but per https://github.com/tomerfiliba/plumbum/issues/48
                #  there are complications re the std io buffers.
                with local.cwd(local.cwd): #assumes we are running in scripts, mabye have install dir env variable?
                    startRedisServerCommand = local.["start-redis-server.command"]
                    startRedisServerCommand()


          

if __name__ == "__main__":
    ProvisionGuessMachinesCLI.run()